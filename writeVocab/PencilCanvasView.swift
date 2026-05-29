import SwiftUI
import PencilKit

struct PencilCanvasView: UIViewRepresentable {
    @Binding var canvasView: PKCanvasView
    let isToolPickerVisible: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> PKCanvasView {
        canvasView.drawingPolicy = .anyInput
        canvasView.backgroundColor = .clear
        canvasView.isOpaque = false
        canvasView.alwaysBounceVertical = false
        canvasView.tool = PKInkingTool(.pen, color: .black, width: 6)

        DispatchQueue.main.async {
            updateToolPicker(for: canvasView, context: context)
        }

        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        DispatchQueue.main.async {
            updateToolPicker(for: uiView, context: context)
        }
    }

    private func updateToolPicker(for uiView: PKCanvasView, context: Context) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return
        }

        let toolPicker: PKToolPicker

        if let existingToolPicker = context.coordinator.toolPicker {
            toolPicker = existingToolPicker
        } else {
            toolPicker = PKToolPicker()
            toolPicker.addObserver(uiView)
            context.coordinator.toolPicker = toolPicker
            context.coordinator.window = window
        }

        if isToolPickerVisible {
            uiView.becomeFirstResponder()
            toolPicker.setVisible(true, forFirstResponder: uiView)
        } else {
            toolPicker.setVisible(false, forFirstResponder: uiView)
            uiView.resignFirstResponder()
        }
    }

    class Coordinator: NSObject {
        var toolPicker: PKToolPicker?
        weak var window: UIWindow?
    }
}