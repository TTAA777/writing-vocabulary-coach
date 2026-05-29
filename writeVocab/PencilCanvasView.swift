import SwiftUI
import PencilKit

struct PencilCanvasView: UIViewRepresentable {
    @Binding var canvasView: PKCanvasView

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
            canvasView.becomeFirstResponder()

            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first {
                let toolPicker = PKToolPicker()
                toolPicker.setVisible(true, forFirstResponder: canvasView)
                toolPicker.addObserver(canvasView)
                toolPicker.addObserver(context.coordinator)
                canvasView.becomeFirstResponder()

                context.coordinator.toolPicker = toolPicker
                context.coordinator.window = window
            }
        }

        return canvasView
    }

    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        DispatchQueue.main.async {
            uiView.becomeFirstResponder()
            context.coordinator.toolPicker?.setVisible(true, forFirstResponder: uiView)
        }
    }

    class Coordinator: NSObject, PKToolPickerObserver {
        var toolPicker: PKToolPicker?
        weak var window: UIWindow?
    }
}